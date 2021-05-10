import { injectable } from 'inversify';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Patch,
  Path,
  Post,
  Put,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { InviteUpdatePayload, Table, TableCreatePayload } from '../services/table-models';
import { InviteCreatePayload } from './../services/table-models';
import { TableService } from './../services/table-service';

interface ValidateErrorJSON {
  message: 'Validation failed';
  details: { [name: string]: unknown };
}

@Security('ApiKeyAuth')
@Route('tables')
@Tags('Tables')
@injectable()
export class TableController extends Controller {
  constructor(private tableService: TableService) {
    super();
  }

  /**
   * Creates a game table.
   *
   * @param requestBody the JSON body in the request
   */
  @Response<ValidateErrorJSON>(422, 'Validation Failed')
  @SuccessResponse('201', 'Created')
  @Post()
  async createTable(@Body() requestBody: TableCreatePayload): Promise<Table> {
    this.setStatus(201);
    return this.tableService.createTable(requestBody);
  }

  /**
   * Fetches an existing table
   *
   * @param id the table id of the table you want to fetch
   * @param user the user making the call
   */
  @Response(404, 'Not Found')
  @SuccessResponse('200', 'Ok')
  @Get('{id}')
  public async getTable(@Path() id: string, @Header('x-user') user?: string): Promise<Table> {
    const table = await this.tableService.getTable(id, user);
    if (!table || !table._id) {
      throw {
        message: 'table not found',
        status: 404,
      };
    }
    return table;
  }

  /**
   * Fetches a list of tables
   *
   * @param user user making the call
   */
  @SuccessResponse('200', 'Ok')
  @Get()
  public async getTables(@Header('x-user') user?: string): Promise<Table[]> {
    return await this.tableService.getTables(user);
  }

  /**
   * Deletes a table.  Not an error if the table does not exist
   *
   * @param id the table id of the table you want to delete
   * @param user user making the call
   */
  @SuccessResponse('204', 'No content')
  @Delete('{id}')
  public async deleteTable(@Path() id: string, @Header('x-user') user?: string): Promise<void> {
    await this.tableService.deleteTable(id, user);
  }

  /**
   * Creates an invitation
   *
   * @param id the table id of the table you want to invite people to
   * @param recipient the person sending the invitations
   * @param payload information to create the invite
   * @param user user making the call
   *
   */
  @SuccessResponse('204', 'No content')
  @Put('{id}/invitations/{recipient}')
  async createInvite(
    @Path() id: string,
    @Path() recipient: string,
    @Body() payload: InviteCreatePayload,
    @Header('x-user') user?: string
  ): Promise<void> {
    return this.tableService.createInvite(id, recipient, payload, user);
  }

  /**
   * Updates an invitation
   *
   * @param id the table id of the table wioth the invite
   * @param recipient the person receiving the invite
   * @param payload information to update the invite
   * @param user user making the call
   */
  @Response<ValidateErrorJSON>(422, 'Validation Failed')
  @SuccessResponse('204', 'No content')
  @Patch('{id}/invitations/{recipient}')
  async updateInvite(
    @Path() id: string,
    @Path() recipient: string,
    @Body() payload: InviteUpdatePayload,
    @Header('x-user') user?: string
  ): Promise<void> {
    this.tableService.updateInvite(id, recipient, payload, user);
  }

  /**
   * Deletes an invitation
   *
   * @param id the table id of the table you want to delete the invite from
   * @param recipient the recipient of the invitation you want to delete
   * @param user user making the call
   */
  @SuccessResponse('204', 'No content')
  @Delete('{id}/invitations/{recipient}')
  async deleteInvite(
    @Path() id: string,
    @Path() recipient: string,
    @Header('x-user') user?: string
  ): Promise<void> {
    return this.tableService.deleteInvite(id, recipient, user);
  }
}
